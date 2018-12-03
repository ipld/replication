Synchronization of Versioned/Append-Only DAGs
=========

This is a proposal for the requirements of a synchronization protocol that allows a set of (non-partitioned) users which each have their own DAG G<sub>i</sub> rooted at the same root node `R` to end up with the same DAG G = G<sub>0</sub> U G<sub>1</sub> U ... G<sub>n</sub>.

Glossary
--------

- **CID**: Hash based content identifier ([CID specification](https://github.com/ipld/specs/blob/master/CID.md)).
- **IPNS**: A mutable system that associates a key with an updateable CID ([IPNS Overview](https://docs.ipfs.io/guides/concepts/ipns/)). It currently only supports single writer semantics.
- **DAG**: Directed acyclic graph, the information structure IPLD can model.
- **Data**: The information users are interested in interacting with
- **Operation**: Information that describes how data is transformed from an "old" version into a "new" version.

Intro and Motivations
-----

When data is modified and we want to be able to refer to both the "old" and "new" data we call that data versioned. One structure that describes versioned data is an operation-based DAG. In an operation-based DAG each of the nodes signifies one version of the data. Similarly, each leaf node of the DAG signifies one of many co-equal "latest" versions of the data.

Allowing applications to be able to create, modify, and reference shared versioned data structures such as the one described above enable a number of potential use cases, including:

- Multi-Writer IPNS
  - If multiple writers simultaneously push a change (IPNS Key, CID) then instead of the system arbitrarily deciding which change is accepted by the network both options can be bubbled up to the application/user layer
- Version Control
  - If multiple users want to push to a single repository they can now do so without worrying about their changes getting clobbered by the eventually consistent replication system.
- Automatic merging collaboration systems
  - Includes Operation Transform (OT) and Commutative Replicated Data Types (CRDTs)
  - Can be used for a range of applications including real-time collaboration and causal chat (i.e. chat where users don't see a particular message before the ones that may have influenced that message)

Interface Specifications
-----

Some important components of any interface for interacting with a verisioned DAG synchronization framework include:

```golang
type DagNode interface {
    GetParents() []DagNode
    GetChildren() []DagNode
    GetValue() Cid // Content format for the Cid is {[]ParentCids, DataCid}, where []ParentCids are in a predictable order
}

type SynchedVersionedDag interface {
  Constructor (DagID, PeerNetwork, LocalDagState)

  // Add event handler that receives the newly added DagNode
  AddNewNodeHandler((DagNode) => void)

  GetRoot() DagNode
  GetLeaves() []DagNode

  AddNode(prevNodeCid CID, newNodeCid CID)
}
```

The above encapsulates the requirements for interacting with the DAG assuming no need to alter the peer network (or any distribution or revocation of signing or decryption keys). This is convenient because it separates the distribution of CIDs from the distribution of the operations/content themselves, allowing for focus on the synchronization algorithm. However, altering the peer network and adding security requirements to the distribution of operations is a closely related problem. Therefore, while the particular interface requirements for the peer network (and its associated authentication and privacy requirements) are in development, the end result should include the possibility of supporting the following:

Network Types:

- Network-wide Gossip: Anyone in the network can participate by joining the topic named GraphID
- Known Peers: Peers known ahead of time and directly connect to (a subset of) each other

Cryptographic Security:

- Privacy
  - No privacy beyond what is inherently provided by the network types
    - e.g. Use TLS to transmit operations, but don't bother using "at rest" encryption (may or may not include authenticating to the network)
  - Operations encrypted under keys distributed to appropriate recipients before being sent across the network
- Integrity/Authentication
  - Nothing required beyond what is inherent to the data structure being stored
    - e.g. CIDs point to content that hashes to the CID
  - Operations signed using group-style keys that do not convey about who signed them beyond the fact that they are authorized to do so
  - Operations signed with individual keys (pseudonymous or named) that are authorized to do so